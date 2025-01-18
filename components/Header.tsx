import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full">
      <div className="w-full flex justify-between p-4">
        <Link href="/">
          <Image
            src="/images/logo.png"
            alt="logo"
            height={36}
            width={156}
          />
        </Link>
      </div>
    </header>
  );
}
