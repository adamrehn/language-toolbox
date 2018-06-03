#include <vector>
using std::vector;

class MyClass
{
	public:
		MyClass()
		{
			*this += 1;
			*this += 2;
		}
		
		MyClass& operator+=(int v)
		{
			this->numbers.push_back(v);
			return *this;
		}
		
		void clear() {
			this->numbers.clear();
		}
		
	private:
		vector<int> numbers;
};

void test()
{
	MyClass m;
	m += 3;
	m += 4;
	m.clear();
}
