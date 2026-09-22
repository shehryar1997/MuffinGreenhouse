import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Leaf, ArrowRight } from "lucide-react"

export const metadata = {
  title: "Page Not Found",
  description: "Looks like this page took a little detour. Let us help you find your way back to the plants.",
}

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-20 lg:py-32">
      <div className="text-center max-w-xl">
        {/* Error Code */}
        <div className="mb-8">
          <span className="font-serif text-[clamp(6rem,15vw,10rem)] leading-none tracking-tighter text-forest-600/20">
            404
          </span>
        </div>

        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sprout-100 mb-6">
          <Leaf className="w-8 h-8 text-forest-600" />
        </div>

        {/* Heading */}
        <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight text-forest-900 mb-4">
          This page went looking for sunlight
        </h1>

        {/* Message */}
        <p className="text-forest-600 text-lg mb-2">
          We looked everywhere, even under the pots.
        </p>
        <p className="text-forest-500/80 mb-10">
          Whatever you were after, it is not here. But plenty of healthy plants are waiting back home.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild variant="default" size="lg" className="min-w-[160px]">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Back to home
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="min-w-[160px]">
            <Link href="/shop/all">
              Browse plants
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
