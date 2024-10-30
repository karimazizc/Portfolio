import unittest
 
def is_prime(n):
    if n <= 2:
        return False
    for i in range(2,n):
        if n % i == 0:
            return False

class Tests(unittest.TestCase):
    
    def test_1(self):
        """ Check that 1 is not prime."""
        self.assertFalse(is_prime(1))

    def test_2(self):
        """ Check that 2 is not prime."""
        self.assertFalse(is_prime(2))


if __name__ == "__main__":
    unittest.main()


