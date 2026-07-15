import { createClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/queries/transactions";
import { StorePhoneNumbersForm } from "@/components/settings/store-phone-numbers";

export default async function PhoneNumbersPage() {
  const supabase = await createClient();
  const storeId = await getCurrentStoreId(supabase);

  let numbers: string[] = [];
  if (storeId) {
    const { data } = await supabase
      .from("stores")
      .select("phone_numbers")
      .eq("id", storeId)
      .single();
    if (data?.phone_numbers) numbers = data.phone_numbers;
  }

  return <StorePhoneNumbersForm initial={numbers} />;
}
