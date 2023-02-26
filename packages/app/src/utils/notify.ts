import React from "react";
import { toast } from "react-hot-toast";

type NotificationType = "success" | "error" | "loading";

const notificationOptions = {
  duration: 4000,
  position: "bottom-center",
};

export const notify = ({
  id,
  content,
  type,
  style,
}: {
  id?: string;
  content: React.ReactNode;
  type?: NotificationType;
  style?: React.CSSProperties;
}) => {
  if (type === "success") {
    // @ts-ignore
    return toast.success(content, { ...notificationOptions, id, style });
  } else if (type === "error") {
    // @ts-ignore
    return toast.error(content, { ...notificationOptions, id, style });
  } else if (type === "loading") {
    // @ts-ignore
    return toast.loading(content, { ...notificationOptions, id, style });
  }

  // @ts-ignore
  return toast(content, { ...notificationOptions, id, style });
};

export const notifyAsync = toast.promise;

export const removeNotification = toast.dismiss;
