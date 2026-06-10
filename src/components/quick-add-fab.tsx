import { useState } from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { ItemForm } from "./item-form";

export function QuickAddFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-30 grid h-14 w-14 place-items-center rounded-full gradient-gold text-gold-foreground shadow-soft md:bottom-6 md:right-6 md:h-16 md:w-16"
        aria-label="দ্রুত আইটেম যোগ"
      >
        <Plus className="h-6 w-6" />
      </motion.button>
      <ItemForm open={open} onOpenChange={setOpen} quickMode />
    </>
  );
}
