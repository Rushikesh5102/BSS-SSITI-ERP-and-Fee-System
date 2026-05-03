import re
import sys

def convert_prisma(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Change provider
    content = content.replace('provider = "postgresql"', 'provider = "sqlite"')

    # Remove all enum definitions
    enum_pattern = re.compile(r'enum \w+ \{[^}]+\}', re.MULTILINE)
    content = re.sub(enum_pattern, '', content)

    # Change enum usages in models to String
    content = re.sub(r'role\s+Role\s+@default\(TEACHER\)', 'role         String   @default("TEACHER")', content)
    content = re.sub(r'mode\s+PaymentMode', 'mode             String', content)
    content = re.sub(r'status\s+PaymentStatus\s+@default\(PENDING\)', 'status           String @default("PENDING")', content)
    content = re.sub(r'channel\s+NotificationChannel', 'channel     String', content)
    content = re.sub(r'status\s+NotificationStatus\s+@default\(PENDING\)', 'status      String  @default("PENDING")', content)
    content = re.sub(r'action\s+AuditAction', 'action     String', content)

    # Remove JSON unsupported by SQLite Prisma provider optionally, but wait: does sqlite support Json in prisma? No, Prisma maps Json on sqlite to String, wait, Prisma removed Json support from sqlite? No, Prisma throws error if type is Json on sqlite. We must change Json to String.
    content = re.sub(r'metadata\s+Json\?', 'metadata   String?', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    convert_prisma(sys.argv[1])
