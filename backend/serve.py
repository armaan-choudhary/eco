import http.server
import socketserver
import os

# --- Configuration ---
PORT = 6969
# Since the script is now in 'backend', the 'public' folder
# is in the same directory.
DIRECTORY = "public"
# -------------------

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # This tells the server to look for files in the 'public' directory
        super().__init__(*args, directory=DIRECTORY, **kwargs)

# This creates and starts the server.
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"✓ Serving frontend from: ./{DIRECTORY}")
    print(f"✓ Open this link in your browser: http://localhost:{PORT}")
    httpd.serve_forever()