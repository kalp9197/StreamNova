import { create } from "zustand";

export const useContentStore = create((set) => ({
<<<<<<< HEAD
	contentType: "movie",
	setContentType: (type) => set({ contentType: type }),
=======
  contentType: "movie",
  setContentType: (type) => set({ contentType: type }),
>>>>>>> 5ce791b (finalizing project and ready for deployment)
}));
