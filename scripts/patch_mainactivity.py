#!/usr/bin/env python3
"""
Patch MainActivity.java sau khi 'npx cap add android' tạo ra nó.
Thêm import + registerPlugin() cho tất cả custom plugins.
"""

import re, sys

PATH = 'android/app/src/main/java/com/aria/assistant/MainActivity.java'

IMPORTS = """\
import com.aria.assistant.FloatingBubblePlugin;
import com.aria.assistant.NotificationReaderPlugin;
import com.aria.assistant.WakeWordPlugin;
import com.aria.assistant.AppWatcherPlugin;
import com.aria.assistant.PhoneSkillsPlugin;
"""

REGISTER_CALLS = """\
        registerPlugin(FloatingBubblePlugin.class);
        registerPlugin(NotificationReaderPlugin.class);
        registerPlugin(WakeWordPlugin.class);
        registerPlugin(AppWatcherPlugin.class);
        registerPlugin(PhoneSkillsPlugin.class);
"""

try:
    with open(PATH, 'r', encoding='utf-8') as f:
        content = f.read()
except FileNotFoundError:
    print(f'ERROR: {PATH} not found', file=sys.stderr)
    sys.exit(1)

# 1. Add imports before 'public class MainActivity'
if 'FloatingBubblePlugin' not in content:
    content = re.sub(
        r'(public class MainActivity)',
        IMPORTS + r'\1',
        content,
        count=1
    )
    print('✓ Imports added')
else:
    print('⚠ Imports already present, skipping')

# 2. Add registerPlugin calls before super.onCreate(savedInstanceState)
if 'registerPlugin(FloatingBubblePlugin' not in content:
    content = content.replace(
        'super.onCreate(savedInstanceState);',
        REGISTER_CALLS + '        super.onCreate(savedInstanceState);',
        1
    )
    print('✓ registerPlugin() calls added')
else:
    print('⚠ registerPlugin() already present, skipping')

with open(PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'✓ Patched: {PATH}')
