import matplotlib
matplotlib.use('Qt5Agg')
import matplotlib.pyplot as plt

X = [590,540,740,130,810,300,320,230,470,620,770,250]
Y = [32,36,39,52,61,72,77,75,68,57,48,48]

plt.scatter(X,Y)
plt.show()
