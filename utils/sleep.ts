/**
 * @author Maksym Shamko (https://github.com/maksymshamko)
 * @organization Gainium (https://github.com/Gainium)
 * @license MIT
 */
/**
 * Utility function to pause execution for a specified duration
 *
 * @param milliseconds - Duration to sleep in milliseconds
 * @returns Promise that resolves after the specified duration
 */
const sleep = (milliseconds: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
export default sleep
