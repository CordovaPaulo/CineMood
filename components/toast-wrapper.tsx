'use client'

import { ToastContainer} from "react-toastify"


export function ToastWrapper() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar
      closeOnClick
      pauseOnHover
      draggable
      theme="colored"
    //   theme="dark"
    />
  )
}

export default ToastWrapper