import { useState } from "react";
import { ShoppingCart } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";
import type { Product } from "../../types";
import QuantityPickerModal from "./QuantityPickerModal";

type Props = {
  product: Product;
  onRequireLogin: () => void;
};

export default function BuyNowButton({ product, onRequireLogin }: Props) {
  const addItems = useCartStore((s) => s.addItems);
  const authToken = useAuthStore((s) => s.token);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const outOfStock = product.stock === 0;

  const openPicker = () => {
    if (!authToken) {
      onRequireLogin();
      return;
    }
    setOpen(true);
  };

  const confirm = (p: Product, qty: number) => {
    addItems(p, qty);
    navigate("/checkout");
  };

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        disabled={outOfStock}
        className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-[8px] transition-colors text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed"
      >
        Beli Sekarang
      </button>
      <QuantityPickerModal
        product={product}
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
      />
    </>
  );
}
