import { Button } from "@/components/ui/button";
import { FC, useState } from "react";
interface DeleteConfirmModelProps {
  selectedNumberOfRow: number;
  handleDeleteRows: () => void;
  handleCancelDeleteRowSelection: ()=>void;
}
const DeleteConfirmModel: FC<DeleteConfirmModelProps> = ({
  selectedNumberOfRow,
  handleDeleteRows,
  handleCancelDeleteRowSelection
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModal = () => {
    setIsModalOpen(true);
  };

  const hideModal = () => {
    setIsModalOpen(false);
  };

  const cancelImportingFn = () => {
    hideModal();
    handleCancelDeleteRowSelection();
  };

  return (
    <div>
      {/* Modal toggle */}
      <Button onClick={showModal} variant={"destructive"} size="sm">
        Delete {selectedNumberOfRow} rows
      </Button>

      {/* Main modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={hideModal}
        >
          <div className="relative bg-white rounded-lg shadow-md dark:bg-gray-700">
            {/* Modal header */}
            <div
              onClick={handleDeleteRows}
              className="flex items-center justify-end p-2 md:p-2 border-b rounded-t dark:border-gray-600"
            >
              <button
                onClick={hideModal}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              >
                <svg
                  className="w-3 h-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 14"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                  />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>

            {/* Modal body */}
            <div className="p-4">
            <svg
              className="text-gray-400 dark:text-gray-500 w-11 h-11 mb-3.5 mx-auto"
              aria-hidden="true"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clip-rule="evenodd"
              ></path>
            </svg>
            <p className="mb-4 text-gray-500 dark:text-gray-300">
              Are you sure you want to delete Seleect Item?
            </p>
            </div>
            {/* Modal footer */}
            <div className="flex items-center justify-between p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-gray-600">
              <Button
                onClick={cancelImportingFn}
                className="ms-3 text-gray-500 bg-white hover:bg-gray-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5  focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
              >
                No, cancel
              </Button>
              <Button variant={"destructive"} onClick={handleDeleteRows}>Yes, I&apos;m sure</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteConfirmModel;
