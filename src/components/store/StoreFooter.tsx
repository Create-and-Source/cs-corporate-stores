"use client";

interface StoreFooterProps {
  companyName: string;
}

export function StoreFooter({ companyName }: StoreFooterProps) {
  return (
    <footer className="bg-black text-white mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-sm text-gray-400">
              {companyName} Merchandise Store
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase text-gray-500">
            <span>Powered by</span>
            <span className="text-kraft font-semibold">Create & Source</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
