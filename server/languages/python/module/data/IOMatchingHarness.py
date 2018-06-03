# Inject our predefined data for stdin
import io, sys
sys.stdin = io.StringIO('''$$__STDIN_DATA__$$''')
del io
del sys


# The user source code will be injected here
$$__USER_CODE__$$
