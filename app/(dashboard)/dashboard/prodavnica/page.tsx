import { PageHeader } from "@/components/features/page-header";
import { AvatarPreview } from "@/components/features/shop/avatar-preview";
import { ShopItemList } from "@/components/features/shop/shop-item-list";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prodavnica | Osnovci",
  description: "Troši XP na super dodatke za svog avatara!",
};

export default function ProdavnicaPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="🛒 Prodavnica"
        description="Nagradi sebe za trud! Kupi nove stvari za svog avatara."
        variant="purple"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <AvatarPreview />
        </div>
        <div className="lg:col-span-2">
          <ShopItemList />
        </div>
      </div>
    </div>
  );
}
