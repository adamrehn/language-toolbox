# Buffer all output to prevent test cases writing to stdout or stderr
import io, sys
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
del io
del sys


# The user source code will be injected here
$$__USER_CODE__$$


# The code that is leveraged by our test case invocation code
_______unitTestResultVectors = []


# Our test case invocation code will be injected here
$$__TEST_CASE_CODE__$$


# Restore stdout to its original value and print the result vector
import json, sys
sys.stdout = sys.__stdout__
print(json.dumps(_______unitTestResultVectors))
