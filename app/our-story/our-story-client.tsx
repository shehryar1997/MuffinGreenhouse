import Image from "next/image"
import Link from "next/link"
import { siteConfig } from "@/config/nav.config"

// PHOTOS: drop each image in /public/story/ and set its `src` below (e.g. "/story/first-room.jpg").
// A chapter with an empty `src` simply renders text only, so nothing looks broken while photos are being collected.
type Photo = { src: string; alt: string }
type Chapter = { label: string; title: string; body: string[]; photo: Photo }

const chapters: Chapter[] = [
  {
    label: "2023",
    title: "One room, one laptop, no plants",
    body: [
      "In 2023 I was working from a single room on my laptop, and something felt missing. I wanted green around me.",
      "I knew nothing about rare plants. Honestly, I knew nothing about gardening. I wasn't earning much back then either, so I did the simple thing: I walked through nurseries, bought what I could afford, and filled the room with leaves.",
      "It made me feel good. That was all I wanted from it.",
    ],
    photo: { src: "", alt: "The first room, filled with plants" },
  },
  {
    label: "The first rare one",
    title: "The plant I couldn't find",
    body: [
      "Then Instagram reels of rare plants found me. The first one I fell for was a Monstera albo. I went from nursery to nursery and couldn't find a single one.",
      "Eventually I met someone who had imported a lot of plants and was generous enough to guide me. My first rare plant came through him, an Alocasia amazonica.",
      "That is where the hobby really started.",
    ],
    photo: { src: "", alt: "My first rare plant, an Alocasia amazonica" },
  },
  {
    label: "Year one",
    title: "I killed a lot of plants",
    body: [
      "For the whole first year, every plant came out of my pocket money or my salary savings. I learned the hard way.",
      "I started propagating. I read everything I could find. I watched how each plant behaved, what it liked, what its quirks were. I killed plenty and I grew plenty, and every single one taught me something.",
    ],
    photo: { src: "", alt: "Early propagation days" },
  },
  {
    label: "The turn",
    title: "Why should these be out of reach?",
    body: [
      "Rare plants are expensive, and I remembered exactly how it felt to want one and not be able to afford it.",
      "So I began propagating them and selling them for less. Not to make a quick profit, but so that more people could have the plants I couldn't at the start.",
    ],
    photo: { src: "", alt: "The first plants I sold" },
  },
  {
    label: "The community",
    title: "A community before a shop",
    body: [
      "I started a WhatsApp community and an Instagram page, and I invited friends and genuinely good people in. I taught them about aroids, sansevierias and hoyas. They bought from me, and they learned alongside me.",
      "It grew into a tight-knit, loving circle, and it was my way of giving back. I've met some really good people along the way, and I've learned a lot from them.",
    ],
    photo: { src: "", alt: "Members of the Muffin community" },
  },
  {
    label: "Importing",
    title: "Bringing the world home",
    body: [
      "Then I became an importer myself, and I started breeding some of my own.",
      "Today plants reach me from Thailand, Indonesia, Malaysia, Sri Lanka and Kenya. I propagate them here, I grow them here, and I sell them here in Pakistan.",
    ],
    photo: { src: "", alt: "A fresh import unpacked and settling in" },
  },
  {
    label: "The team",
    title: "Then I met my partner",
    body: [
      "Along the way I met my partner, who had been working in lawn, landscape and maintenance services, and in rare plants, for quite some time. He brought years of hands-on experience to something I had been learning one plant at a time.",
      "With him, the team grew from just me to seven of us today, and it keeps growing.",
      "We're looking forward to people joining us, and to building this community together.",
    ],
    photo: { src: "", alt: "The Muffin Plants team" },
  },
  {
    label: "Today",
    title: "What Muffin Plants is for",
    body: [
      "A place to find rare aroids, sansevierias, hoyas, orchids and more. Next to them, premium tools, and not cheap ones on purpose. These plants deserve a good tool, and the person working with them should enjoy using it.",
      "It is built for the person who bought their first plant last week and for the collector who has been chasing species for years.",
    ],
    photo: { src: "", alt: "The greenhouse today" },
  },
  {
    label: "Three years in",
    title: "Just getting started",
    body: [
      "I'll be hosting events to teach the community, writing plenty of journal posts, and sharing everything I've learned about these plants.",
      "My hope is simple: that this hobby becomes common in Pakistan. That more people learn about these plants, become collectors, and discover how therapeutic gardening can be.",
    ],
    photo: { src: "", alt: "Muffin Plants community event" },
  },
]

// The quote panel appears after this chapter index (0-based): after "Why should these be out of reach?".
const QUOTE_AFTER = 3

function ChapterPhoto({ photo }: { photo: Photo }) {
  if (!photo.src) return null
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-forest-50">
      <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 320px, 100vw" className="object-cover" />
    </div>
  )
}

export default function OurStoryPageClient() {
  const whatsappHref = `https://wa.me/${siteConfig.whatsappNumber.replace(/\D/g, "")}`

  return (
    <div className="bg-cream-100 min-h-screen">
      <div className="container mx-auto px-4 pt-32 pb-24">
        <header className="mx-auto mb-24 max-w-4xl">
          <h1 className="font-serif text-display text-forest-900">It started with a laptop and a bare room.</h1>
          <p className="mt-8 max-w-2xl font-serif text-heading-3 italic text-forest-700">
            Three years, a lot of dead leaves, and a community that grew faster than any of my plants.
          </p>
        </header>

        <div className="mx-auto max-w-5xl">
          {chapters.map((chapter, i) => (
            <div key={chapter.title}>
              <section className="grid gap-x-10 md:grid-cols-[9rem_1fr]">
                <p className="mb-3 font-serif text-heading-4 italic text-clay-500 md:sticky md:top-28 md:mb-0 md:self-start md:text-right">
                  {chapter.label}
                </p>

                <div className="relative pb-20 md:border-l md:border-forest-200 md:pl-10">
                  <span aria-hidden className="absolute -left-[5px] top-2 hidden h-[9px] w-[9px] rounded-full bg-clay-500 md:block" />
                  <div className={chapter.photo.src ? "grid items-start gap-10 lg:grid-cols-[1fr_20rem]" : ""}>
                    <div className="max-w-xl">
                      <h2 className="mb-5 font-serif text-heading-2 text-forest-900">{chapter.title}</h2>
                      <div className="space-y-4 text-body-lg text-forest-700">
                        {chapter.body.map((p) => (
                          <p key={p}>{p}</p>
                        ))}
                      </div>
                    </div>
                    <ChapterPhoto photo={chapter.photo} />
                  </div>
                </div>
              </section>

              {i === QUOTE_AFTER && (
                <figure className="my-4 mb-24 rounded-lg bg-ink px-8 py-16 text-center text-paper md:px-16 md:py-24">
                  <blockquote className="mx-auto max-w-3xl font-serif text-heading-1">
                    I wanted everyone to have access to the plants I didn&apos;t.
                  </blockquote>
                </figure>
              )}
            </div>
          ))}
        </div>

        <section className="mx-auto mt-8 max-w-3xl text-center">
          <h2 className="font-serif text-heading-1 text-forest-900">Come grow with us</h2>
          <p className="mx-auto mt-4 max-w-xl text-body-lg text-forest-700">
            Whether you bought your first plant last week or you&apos;ve been collecting for years, there is a place for you here, and if you&apos;d like to join the team, message us.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-ink px-8 py-3 font-medium text-paper transition-colors hover:bg-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500"
            >
              Chat with us on WhatsApp
            </a>
            <Link
              href="/shop/all"
              className="rounded-full border border-forest-300 px-8 py-3 font-medium text-forest-900 transition-colors hover:bg-forest-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500"
            >
              Browse the plants
            </Link>
          </div>
          <p className="mt-6 text-body-sm text-forest-700">
            Or follow along on{" "}
            <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
              Instagram
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
