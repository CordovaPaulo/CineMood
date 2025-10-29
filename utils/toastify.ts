import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

export function showToast(message: string, type: "success" | "error" | "info") {
  switch (type) {
    case "success":
      toast.success(message);
      break;
    case "error":
      toast.error(message);
      break;
    case "info":
      toast.info(message);
      break;
  }
}
