export interface DataPoint {
  id: string;
  experience: number;
  salary: number;
  isCustom?: boolean;
}

export const originalDataset: DataPoint[] = [
  { id: '1', experience: 1.1, salary: 39343 },
  { id: '2', experience: 1.2, salary: 42774 },
  { id: '3', experience: 1.3, salary: 46205 },
  { id: '4', experience: 1.5, salary: 37731 },
  { id: '5', experience: 2.0, salary: 43525 },
  { id: '6', experience: 2.2, salary: 39891 },
  { id: '7', experience: 2.5, salary: 48266 },
  { id: '8', experience: 2.9, salary: 56642 },
  { id: '9', experience: 3.0, salary: 60150 },
  { id: '10', experience: 3.2, salary: 54445 },
  { id: '11', experience: 3.2, salary: 64445 },
  { id: '12', experience: 3.5, salary: 60000 },
  { id: '13', experience: 3.7, salary: 57189 },
  { id: '14', experience: 3.8, salary: 60200 },
  { id: '15', experience: 3.9, salary: 63218 },
  { id: '16', experience: 4.0, salary: 55794 },
  { id: '17', experience: 4.0, salary: 56957 },
  { id: '18', experience: 4.1, salary: 57081 },
  { id: '19', experience: 4.3, salary: 59095 },
  { id: '20', experience: 4.5, salary: 61111 },
  { id: '21', experience: 4.7, salary: 64500 },
  { id: '22', experience: 4.9, salary: 67938 },
  { id: '23', experience: 5.1, salary: 66029 },
  { id: '24', experience: 5.3, salary: 83088 },
  { id: '25', experience: 5.5, salary: 82200 },
  { id: '26', experience: 5.9, salary: 81363 },
  { id: '27', experience: 6.0, salary: 93940 },
  { id: '28', experience: 6.2, salary: 91000 },
  { id: '29', experience: 6.5, salary: 90000 },
  { id: '30', experience: 6.8, salary: 91738 },
  { id: '31', experience: 7.1, salary: 98273 },
  { id: '32', experience: 7.9, salary: 101302 },
  { id: '33', experience: 8.2, salary: 113812 },
  { id: '34', experience: 8.5, salary: 111620 },
  { id: '35', experience: 8.7, salary: 109431 },
  { id: '36', experience: 9.0, salary: 105582 },
  { id: '37', experience: 9.5, salary: 116969 },
  { id: '38', experience: 9.6, salary: 112635 },
  { id: '39', experience: 10.3, salary: 122391 },
  { id: '40', experience: 10.5, salary: 121872 },
];

export interface CodeStep {
  title: string;
  code: string;
  explanation: string;
  roleInRegression: string;
}

export const colabSteps: CodeStep[] = [
  {
    title: "1. Data Acquisition",
    code: `import pandas as pd
import numpy as np

# Load dataset from URL
df = pd.read_csv('https://github.com/ybifoundation/Dataset/raw/main/Salary%20Data.csv')
print(df.head())`,
    explanation: "First, we import pandas and numpy to load and parse the raw tabular data from the YBIFoundation salary CSV. This dataset lists the independent variable (Years of Experience) and the dependent variable (Salary).",
    roleInRegression: "Gathers the raw input data points. Each record $(x_i, y_i)$ acts as a training example for the machine learning model."
  },
  {
    title: "2. Exploratory Visualization",
    code: `import matplotlib.pyplot as plt

# Scatter plot of experience vs salary
plt.scatter(df['Experience Years'], df['Salary'])
plt.xlabel('Years of Experience', color="blue")
plt.ylabel('Salary', color="blue")
plt.title('Salary vs Experience', color="Red")
plt.show()`,
    explanation: "This displays a standard scatter plot to understand the visual correlation. We can immediately observe a very strong linear pattern, suggesting simple linear regression is highly appropriate.",
    roleInRegression: "Validates assumptions of linearity. In real-world data science, visualizing data first prevents fitting a linear model to non-linear relationships."
  },
  {
    title: "3. Model Training (Fitting)",
    code: `from sklearn import linear_model

# Initialize the simple linear regression model
lr = linear_model.LinearRegression()

# Train the model on independent X and dependent y
lr.fit(df[['Experience Years']], df.Salary)`,
    explanation: "We initialize scikit-learn's `LinearRegression` class and fit it using Ordinary Least Squares (OLS). It computes the optimum values for the Slope ($m$) and Y-Intercept ($c$) that minimize the residual sum of squares.",
    roleInRegression: "Calculates the best-fitting line equation: $y = m \\cdot x + c$. Internally, it computes the means, variances, and covariances to find $m$ and $c$."
  },
  {
    title: "4. Prediction testing",
    code: `# Predict salary for a specific value (e.g., 10 Years)
lr.predict([[10]])`,
    explanation: "Now that we have computed $m$ and $c$, we can feed in any arbitrary value of Experience ($x = 10$) to predict the corresponding Salary ($y$).",
    roleInRegression: "Tests the model. The model computes $y_{pred} = m \\cdot 10 + c$ to output the predicted salary value."
  },
  {
    title: "5. Accuracy Evaluation",
    code: `# Score the model's accuracy on the training set
lr.score(df[['Experience Years']], df.Salary)`,
    explanation: "The `.score()` method computes the $R^2$ (coefficient of determination). An $R^2$ score close to 1.0 indicates that the model explains a vast majority of the variance in salaries.",
    roleInRegression: "Evaluation. $R^2$ indicates the proportion of total variation in Salaries explained by the Years of Experience. High score = excellent fit."
  },
  {
    title: "6. Regression Line Plot",
    code: `# Draw regression line on top of scatter plot
plt.scatter(df['Experience Years'], df['Salary'])
plt.xlabel('Years of Experience', color="blue")
plt.ylabel('Salary', color="blue")
plt.title('Salary vs Experience', color="Red")
plt.plot(df['Experience Years'], lr.predict(df[['Experience Years']]), color='red')
plt.show()`,
    explanation: "Finally, we plot the raw scatter points together with the red prediction line. This visualizes exactly how well the model captured the trend of the data points.",
    roleInRegression: "Visual confirmation. Shows the line passing through the centroid of the data points, illustrating the optimal fit."
  }
];
