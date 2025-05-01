import { delay } from "https://esm.sh/jsr/@std/async@1.0.12";

/**
 * Gets the current value of a GPIO pin.
 *
 * This function handles the entire process of:
 * 1. Calculating the actual GPIO number (base + pin offset)
 * 2. Exporting the GPIO pin if not already exported
 * 3. Setting the pin direction to input
 * 4. Reading the pin value
 *
 * @param pinNumber - The pin number to read (will be added to the base GPIO number)
 * @returns A Promise that resolves to a boolean: true if the pin is HIGH (1), false if LOW (0)
 */
export async function getPinValue(pinNumber: number): Promise<boolean> {
  // Calculate the GPIO number (base + pin offset)
  const baseGpio = 512;
  const gpioNumber = baseGpio + pinNumber;

  // Check if the pin is already exported
  try {
    await Deno.stat(`/sys/class/gpio/gpio${gpioNumber}`);
  } catch {
    // If not exported, export it
    await Deno.writeTextFile("/sys/class/gpio/export", gpioNumber.toString());

    // Small delay to allow the system to create the necessary files
    await delay(100);

    // Set direction to input
    await Deno.writeTextFile(
      `/sys/class/gpio/gpio${gpioNumber}/direction`,
      "in",
    );
  }

  // Read the GPIO value
  const value =
    (await Deno.readTextFile(`/sys/class/gpio/gpio${gpioNumber}/value`)).trim();

  // Return boolean based on the value
  return value === "1";
}

/**
 * Waits until the specified GPIO pin matches the target state and remains in that state for 200ms.
 * It continuously reads the pin's value until it matches the target value and stays that way.
 *
 * @param pinNumber The GPIO pin number to monitor.
 * @param targetState The target state (true for HIGH, false for LOW) to wait for.
 * @returns A promise that resolves when the pin state matches the target state and remains stable for 200ms.
 */
export async function waitUntilPinStateChange(
  pinNumber: number,
  targetState: boolean,
): Promise<void> {
  while (true) {
    const currentValue = await getPinValue(pinNumber);

    if (currentValue === targetState) {
      await delay(200);
      const newValue = await getPinValue(pinNumber);

      if (newValue === targetState) {
        console.log("Pin state stabilized at:", newValue);
        return;
      } else {
        console.log(
          "Pin state changed but did not stabilize, continuing to wait.",
        );
      }
    }

    await delay(200);
  }
}
