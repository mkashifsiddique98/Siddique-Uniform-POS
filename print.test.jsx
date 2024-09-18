import { render, screen, fireEvent } from "@testing-library/react";
import PayNowChart from "@/components/PayNowChart";
import EscPosEncoder from 'esc-pos-encoder';
import { Products } from "@/lib/store";

// Mock the USBDevice and related methods
class MockUSBDevice {
  writable = {
    getWriter: jest.fn().mockReturnValue({
      write: jest.fn(),
      releaseLock: jest.fn(),
    }),
  };

  open = jest.fn();
  close = jest.fn();
}

global.USBDevice = MockUSBDevice;

describe("PayNowChart Printer Setup", () => {
  let productList: Products[] = [
    { productName: "Shirt", quantity: 2, sellPrice: 500 },
    { productName: "Pants", quantity: 1, sellPrice: 700 },
  ];

  const grandTotal = 1700;
  const discount = 100;
  const disInPercentage = 5;

  const setup = () => {
    render(
      <PayNowChart
        grandTotal={grandTotal}
        discount={discount}
        productList={productList}
        disInPercentage={disInPercentage}
        handleReset={() => {}}
      />
    );
  };

  it("should render Pay Now button", () => {
    setup();
    const button = screen.getByText(/pay now/i);
    expect(button).toBeInTheDocument();
  });

  it("should initialize and write data to the printer on print", async () => {
    const mockDevice = new MockUSBDevice();

    // Mock USB device selection and connection
    const mockRequestPort = jest.fn().mockResolvedValue(mockDevice);
    navigator.usb = { requestPort: mockRequestPort };

    setup();

    // Simulate clicking the Pay Now button to open the dialog
    const payNowButton = screen.getByText(/pay now/i);
    fireEvent.click(payNowButton);

    // Simulate clicking the Print Receipt button
    const printReceiptButton = screen.getByText(/print receipt/i);
    fireEvent.click(printReceiptButton);

    // Wait for the printer connection to be made
    await mockRequestPort();

    // Mock EscPosEncoder data and check if the methods were called
    const encoder = new EscPosEncoder();
    const receiptData = encoder
      .initialize()
      .align('center')
      .text('Siddique Uniform Centre')
      .newline()
      .encode();

    // Check if the USB device was opened
    expect(mockDevice.open).toHaveBeenCalledTimes(1);

    // Check if the receipt data is written to the device
    const writer = mockDevice.writable.getWriter();
    expect(writer.write).toHaveBeenCalledWith(receiptData);

    // Check if the writer was released and the device was closed
    expect(writer.releaseLock).toHaveBeenCalledTimes(1);
    expect(mockDevice.close).toHaveBeenCalledTimes(1);
  });
});
