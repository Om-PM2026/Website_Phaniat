import http.server
import socketserver
import webbrowser
import os
import mimetypes

PORT = 5173
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Ensure proper MIME types for JavaScript and CSS
mimetypes.init()
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/javascript', '.mjs')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('image/svg+xml', '.svg')

class CustomHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def run():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), CustomHTTPHandler) as httpd:
        print(f"Server started at http://localhost:{PORT}")
        print(f"Serving files from {DIRECTORY}")
        httpd.serve_forever()

if __name__ == '__main__':
    run()
