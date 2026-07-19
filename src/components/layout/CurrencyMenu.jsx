'use client'

import { Currencies, Currencies_LIST } from "@/constants/currencies";
import { setCurrency, setCurrencySymbol } from "@/store/slices/uiSlice";
import { useDispatch, useSelector } from "react-redux";
import Menu from "./Menu";
import { Banknote } from "lucide-react";
import { setCookie } from "@/utils/cookies";

export default function CurrencyMenu() {
    const dispatch = useDispatch();
    const currency = useSelector((s) => s.ui.currency);
    
    const changeCurrency = (newCurrency) => {
        const symbol = Currencies.find(c => c.Key === newCurrency)?.symbol ?? '';
        dispatch(setCurrency(newCurrency));
        dispatch(setCurrencySymbol(symbol));
        setCookie('currency', newCurrency);
    }

     return (
       <Menu 
         menuButtonElement={
           <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors">
             <Banknote size={14} />
             <span className="hidden md:block text-sm font-medium text-gray-600">
               {currency}
             </span>
           </div>
         }
       >
         {Currencies_LIST.map((c, i) => (
           <button
             key={i}
             onClick={() => changeCurrency(c.Key)}
             className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-gray-200 text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors justify-center hover:bg-gray-50 w-full"
           >
             {c.Key}
           </button>
         ))}
       </Menu>
     );
}