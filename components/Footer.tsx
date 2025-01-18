import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full text-center">
      Made in 🏖️ by{" "}
      <Link href={"x.com/_nikhilsheoran"} target="_blank" className="underline">
        Nikhil
      </Link>
      , Utkarsh and Gaurav.
    </footer>
  );
}
