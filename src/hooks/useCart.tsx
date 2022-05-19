import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(getSorageCart());

  function getSorageCart() {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  }

  const addProduct = async (productId: number) => {
    try {
      const productinCart = cart.find((product) => product.id === productId);

      if (!productinCart) {
        const { data: product } = await api.get<Product>(
          `/products/${productId}`
        );
        const { data: stock } = await api.get<Stock>(`/stock/${productId}`);
        if (stock.amount > 0) {
          const newCart = [...cart, { ...product, amount: 1 }];
          setCart(newCart);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
          toast.success("Produto adicionado com sucesso!");
          return;
        } else {
          toast.error("Quantidade solicitada fora de estoque");
        }
      } else {
        const { data: stock } = await api.get<Stock>(`/stock/${productId}`);
        if (productinCart.amount < stock.amount) {
          const newCart = cart.map((product) =>
            product.id === productId
              ? { ...product, amount: product.amount + 1 }
              : product
          );
          setCart(newCart);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
          toast.success("Produto adicionado com sucesso!");
        } else {
          toast.error("Quantidade solicitada fora de estoque");
        }
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = cart.find((p) => p.id === productId);
      if (product) {
        const newCart = cart.filter((p) => p.id !== productId);
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      }
      throw new Error();
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount >= 1) {
        const product = cart.find((p) => p.id === productId);
        if (product) {
          const { data: stock } = await api.get<Stock>(`/stock/${productId}`);
          if (amount <= stock.amount) {
            const newCart = cart.map((p) =>
              p.id === productId ? { ...p, amount } : p
            );
            setCart(newCart);
            localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
          } else {
            toast.error("Quantidade solicitada fora de estoque");
          }
        } else {
          throw new Error();
        }
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
