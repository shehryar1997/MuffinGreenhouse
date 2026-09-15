import Image from "next/image"

export default function OurStoryPage() {
  return (
    <div className="bg-cream-100 min-h-screen">
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-mono text-sm text-forest-500 mb-2">About Us</p>
            <h1 className="font-serif text-display text-forest-900">Our Story</h1>
          </div>

          <div className="space-y-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-serif text-heading-2 text-forest-900 mb-4">We killed a lot of plants so you do not have to</h2>
                <p className="text-forest-700 text-body-lg">Muffin started with one dead fiddle leaf fig and a lot of googling. We learned that Karachi's heat and humidity require different care than generic advice online.</p>
              </div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-forest-50">
                <Image src="https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800&q=80" alt="Plant nursery" fill className="object-cover" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 relative aspect-[4/3] rounded-2xl overflow-hidden bg-forest-50">
                <Image src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80" alt="Growing plants" fill className="object-cover" />
              </div>
              <div className="order-1 md:order-2">
                <h2 className="font-serif text-heading-2 text-forest-900 mb-4">Local growing for local homes</h2>
                <p className="text-forest-700 text-body-lg">Every plant is grown right here in Karachi, acclimatized to our weather from day one. No shipping stress, no climate shock — just healthy plants ready for your home.</p>
              </div>
            </div>

            <div className="bg-forest-300 text-cream-100 rounded-2xl p-12 text-center">
              <p className="font-serif text-heading-2 mb-4">Our Promise</p>
              <p className="text-cream-300/90 text-body-lg max-w-2xl mx-auto">Honest advice, fair prices, and plants that survive Karachi. No miracle cures — just plants and people who care.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
