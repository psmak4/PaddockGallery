import '@testing-library/jest-dom/vitest';
import { resetEditionsForTests } from '../cards/editions';

// jsdom doesn't implement scrolling.
window.scrollTo = () => {};

afterEach(() => {
  localStorage.clear();
  resetEditionsForTests();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
