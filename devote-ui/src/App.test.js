import { render, screen } from '@testing-library/react';
import App from './App';

test('renders DeVote dashboard', () => {
  render(<App />);
  expect(screen.getByText(/DeVote/i)).toBeInTheDocument();
});
