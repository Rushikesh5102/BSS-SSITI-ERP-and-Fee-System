import os
import re

ENUMS = {'Role', 'PaymentMode', 'PaymentStatus', 'NotificationChannel', 'NotificationStatus', 'AuditAction'}

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find import from @prisma/client
    prisma_import_match = re.search(r"import\s+\{([^}]+)\}\s+from\s+('@prisma/client'|\"@prisma/client\");?", content)
    if not prisma_import_match:
        return

    imported_items = [item.strip() for item in prisma_import_match.group(1).split(',')]
    
    # Identify which enums are imported
    imported_enums = [item for item in imported_items if item in ENUMS]
    
    if not imported_enums:
        return # No enums to patch
        
    # Remove enums from the original import
    new_prisma_imports = [item for item in imported_items if item not in ENUMS]
    
    if new_prisma_imports:
        new_import_str = f"import {{ {', '.join(new_prisma_imports)} }} from '@prisma/client';"
    else:
        new_import_str = "" # If it's empty, remove the import line entirely (though rarely we import *only* enums)

    # Calculate relative path to src/types/enums
    # filepath is like .../src/controllers/auth.controller.ts
    # Depth from src:
    rel_path = os.path.relpath(filepath, 'src')
    depth = rel_path.count(os.sep)
    
    if depth == 0:
        enum_path = './types/enums'
    else:
        enum_path = '../' * depth + 'types/enums'
        
    enum_import_str = f"import {{ {', '.join(imported_enums)} }} from '{enum_path}';"
    
    # Replace the old import with the new ones
    content = content[:prisma_import_match.start()] + new_import_str + '\n' + enum_import_str + '\n' + content[prisma_import_match.end():]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    for root, dirs, files in os.walk('src'):
        for file in files:
            if file.endswith('.ts'):
                patch_file(os.path.join(root, file))
                
if __name__ == '__main__':
    main()
