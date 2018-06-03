import sys

def ioStuff():
	print('This is stdout data.')
	sys.stdout.flush()
	print('This is stderr data.', file=sys.stderr)
	sys.stderr.flush()
	data = input('Enter user input:')
	print('The stdin data: {}'.format(data))
