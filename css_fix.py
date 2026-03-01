import os
import re

html_dir = 'app/templates'
css_dir = 'app/static/css'

for fn in os.listdir(html_dir):
    if fn.endswith('.html'):
        html_path = os.path.join(html_dir, fn)
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Capture the whole href attribute value including template tags
        links = re.findall(r'<link[^>]*rel=[\"\']stylesheet[\"\'][^>]*href=[\"\']([^\"\']+)[\"\'][^>]*>', content)
        if not links:
            continue
            
        css_contents = []
        for href in links:
            css_file = None
            if 'url_for' in href:
                # e.g., {{ url_for('static', filename='css/teacher.css') }}
                m = re.search(r'filename=[\"\']([^\"\']+)[\"\']', href)
                if m:
                    filename = m.group(1)
                    css_file = os.path.join('app/static', filename)
            else:
                # e.g., /static/css/admin.css or ../static/css/student.css
                filename = href.split('/')[-1]
                css_file = os.path.join(css_dir, filename)
                
            if css_file and os.path.exists(css_file):
                with open(css_file, 'r', encoding='utf-8') as f:
                    css_contents.append(f.read())
            else:
                print(f'Warning: {css_file} not found for {fn}')

        if not css_contents:
            print(f'No CSS contents extracted for {fn}')
            # We don't want to overwrite if something failed parsing
            continue

        base_name = os.path.splitext(fn)[0].lower()
        new_css_name = f'{base_name}.css'
        new_css_path = os.path.join(css_dir, new_css_name)
        
        with open(new_css_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(css_contents))
            
        new_html = re.sub(r'<link[^>]*rel=[\"\']stylesheet[\"\'][^>]*>', '', content)
        
        link_str = f'<link rel="stylesheet" href="/static/css/{new_css_name}">'
        new_html = new_html.replace('</head>', f'    {link_str}\n</head>')
        
        new_html = re.sub(r'\n\s*\n\s*</head>', '\n</head>', new_html)
        
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(new_html)
            
        print(f'Processed {fn} -> {new_css_name} combining {len(links)} files')
