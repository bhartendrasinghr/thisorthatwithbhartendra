import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { ThisOrThat } from "@/components/ThisOrThat";
import { About } from "@/components/About";
import { Episodes } from "@/components/Episodes";
import { Subscribe } from "@/components/Subscribe";
import { Footer } from "@/components/Footer";
import { getEpisodes } from "@/lib/youtube";

export const revalidate = 1800;

export default async function HomePage() {
  const episodes = await getEpisodes();
  const [featured, ...rest] = episodes;
  const list = rest.length ? rest : episodes;

  return (
    <>
      <Nav />
      <main>
        <Hero featured={featured} />
        <ThisOrThat />
        <Episodes episodes={list.slice(0, 9)} />
        <About />
        <Subscribe />
      </main>
      <Footer />
    </>
  );
}
