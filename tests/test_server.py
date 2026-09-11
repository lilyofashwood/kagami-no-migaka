import importlib.util
from pathlib import Path
import json
import threading
import unittest
import urllib.request
import urllib.error
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('workshop_server',Path(__file__).resolve().parents[1]/'server.py')
server=importlib.util.module_from_spec(spec);spec.loader.exec_module(server)

class AdapterTests(unittest.TestCase):
    def config(self,**kw):return {'provider':'openai-responses','model':'test-model','key':'fixture-not-a-key',**kw}
    def test_protocol_requests(self):
        for provider in server.PROVIDERS:
            p,r=server.build_request(self.config(provider=provider),'Return JSON')
            body=json.loads(r.data);self.assertEqual(body['model'],'test-model');self.assertEqual(p,provider)
            if p=='openai-responses':self.assertFalse(body['store']);self.assertIn('max_output_tokens',body)
            elif p=='anthropic':self.assertIn('max_tokens',body);self.assertTrue(r.has_header('X-api-key'))
            else:self.assertIn('max_completion_tokens',body)
    def test_unsafe_configs(self):
        for endpoint in ['http://example.com/v1','https://user:key@example.com','file:///etc/passwd','https://example.com/?key=secret']:
            with self.assertRaises(ValueError):server.build_request(self.config(endpoint=endpoint),'x')
        for limit in [True,0,20000,'4096']:
            with self.assertRaises(ValueError):server.build_request(self.config(maxTokens=limit),'x')
        with self.assertRaises(ValueError):server.build_request(self.config(model=''),'x')
    def test_responses(self):
        self.assertEqual(server.parse_response('openai-responses',{'status':'completed','output':[{'type':'reasoning'},{'type':'message','content':[{'type':'output_text','text':'{"carrier":"lamp"}'}]}]}),{'carrier':'lamp'})
        self.assertEqual(server.parse_response('anthropic',{'stop_reason':'end_turn','content':[{'type':'text','text':'{"grid":[]}'}]}),{'grid':[]})
        self.assertEqual(server.parse_response('openai-compatible',{'choices':[{'finish_reason':'stop','message':{'content':'{"ok":true}'}}]}),{'ok':True})
        for data in [{'status':'incomplete'},{'status':'completed','output':[]},{'status':'completed','output':[{'type':'message','content':[{'type':'output_text','text':'```json\n{}\n```'}]}]}]:
            with self.assertRaises(ValueError):server.parse_response('openai-responses',data)
    def test_environment_key_is_bound_to_provider_origin(self):
        with patch.dict(server.os.environ, {'OPENAI_API_KEY':'environment-fixture-secret'}):
            _,official=server.build_request(self.config(key=''),'x')
            self.assertEqual(official.get_header('Authorization'),'Bearer environment-fixture-secret')
            _,local=server.build_request(self.config(key='',endpoint='http://127.0.0.1:9999/v1/responses'),'x')
            self.assertFalse(local.has_header('Authorization'))
            with self.assertRaises(ValueError):server.build_request(self.config(key='',endpoint='https://custom.example/v1/responses'),'x')
            with self.assertRaises(ValueError):server.build_request(self.config(key='',endpoint='https://api.openai.com:8443/v1/responses'),'x')
            _,custom=server.build_request(self.config(key='explicit-custom-fixture',endpoint='https://custom.example/v1/responses'),'x')
            self.assertEqual(custom.get_header('Authorization'),'Bearer explicit-custom-fixture')

class HTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.http=server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler)
        cls.thread=threading.Thread(target=cls.http.serve_forever,daemon=True);cls.thread.start()
        cls.url=f'http://127.0.0.1:{cls.http.server_port}'
    @classmethod
    def tearDownClass(cls):cls.http.shutdown();cls.http.server_close();cls.thread.join()
    def test_static_files_and_denied_source(self):
        with urllib.request.urlopen(self.url+'/') as r:
            self.assertIn(b'<html',r.read());self.assertIn("connect-src 'self'",r.headers['Content-Security-Policy'])
        for path in ['/server.py','/.env','/historical/stegweb-suite.py','/../server.py']:
            with self.assertRaises(urllib.error.HTTPError) as e:urllib.request.urlopen(self.url+path)
            self.assertEqual(e.exception.code,404)
    def test_foreign_origin_and_host(self):
        for headers in [{'Origin':'https://attacker.invalid'},{'Host':'attacker.invalid'}]:
            with self.assertRaises(urllib.error.HTTPError) as e:urllib.request.urlopen(urllib.request.Request(self.url+'/',headers=headers))
            self.assertEqual(e.exception.code,403)
    def test_local_adapter_marker_is_server_only(self):
        self.assertNotIn(b'name="layered-song-local-adapter"',(server.ROOT/'index.html').read_bytes())
        for path in ['/', '/index.html']:
            with urllib.request.urlopen(self.url+path) as response:
                self.assertIn(b'<meta name="layered-song-local-adapter" content="v1">',response.read())
        with urllib.request.urlopen(self.url+'/lettering.js') as response:
            self.assertIn(b'UI_REGISTERS',response.read())
    def test_private_originals_and_tracked_source_are_never_served(self):
        for path in ['/private-source/README(4).md','/private-source/full_recovered_kasaneuta_prompt_verbatim.md',
                     '/historical/evening-intake/README(4).md','/.git/config','/data/naming-proposals.json']:
            with self.assertRaises(urllib.error.HTTPError) as error:urllib.request.urlopen(self.url+path)
            self.assertEqual(error.exception.code,404)
if __name__=='__main__':unittest.main()
