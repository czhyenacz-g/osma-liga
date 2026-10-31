import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import MatchFinder from "@/components/football/MatchFinder";
import { buildDemoMatches } from "@/lib/football/demoMatches";
import type { VenuePin } from "@/lib/football/matches";

// Leaflet v jsdom nevykreslíme; náhrada vypíše piny jako tlačítka.
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

vi.mock("@/components/football/MatchMap", () => ({
  default: ({ pins, selectedKey, onSelectPin }: { pins: VenuePin[]; selectedKey: string | null; onSelectPin: (k: string) => void }) => (
    <div data-testid="match-map">
      {pins.map((p) => (
        <button key={p.key} data-pin={p.key} aria-pressed={p.key === selectedKey} onClick={() => onSelectPin(p.key)}>
          pin {p.label} ({p.matchIds.join(",")})
        </button>
      ))}
    </div>
  ),
}));

beforeAll(() => {
  // Desktop: seznam i mapa vedle sebe.
  window.matchMedia = ((q: string) => ({
    matches: true, media: q, addEventListener() {}, removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView = () => {};
});

// Středa 4. 11. 2026 12:00 SEČ; Date.now() v efektu se zafixuje stejně.
const NOW = Date.parse("2026-11-04T11:00:00Z");

function setup(defaultLeague: 3 | 4 | 5 | 6 | 7 | null = null) {
  vi.spyOn(Date, "now").mockReturnValue(NOW);
  const matches = buildDemoMatches(new Date(NOW));
  return render(
    <MatchFinder matches={matches} sourceName="DEMO — fiktivní data" demo defaultLeague={defaultLeague} initialNowMs={NOW} />,
  );
}

const cards = () => within(screen.getByTestId("match-list")).queryAllByRole("listitem");

describe("MatchFinder (demo data)", () => {
  it("výchozí soutěž podle stránky a výchozí termín 3 dny", () => {
    setup(3);
    expect(screen.getByLabelText("Soutěž")).toHaveValue("3");
    expect(screen.getByRole("button", { name: "3 dny" })).toHaveAttribute("aria-pressed", "true");
    expect(cards().length).toBeGreaterThan(0);
    expect(cards().every((c) => c.textContent?.includes("3. liga"))).toBe(true);
    expect(screen.getByText(/DEMO — všechny zápasy/)).toBeInTheDocument();
  });

  it("změna soutěže a termínu mění seznam", () => {
    setup(null);
    const all = cards().length;
    fireEvent.change(screen.getByLabelText("Soutěž"), { target: { value: "7" } });
    expect(cards().length).toBeLessThan(all);
    expect(cards().every((c) => c.textContent?.includes("7. liga"))).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Víkend" }));
    expect(cards().every((c) => /sobota|neděle/.test(c.textContent ?? ""))).toBe(true);
  });

  it("navigace jen s ověřeným místem, jinak upozornění", async () => {
    setup(null);
    const navs = screen.getAllByRole("link", { name: "Navigovat na hřiště" });
    expect(navs.length).toBeGreaterThan(0);
    for (const a of navs) {
      expect(a.getAttribute("href")).toMatch(/^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=-?\d+\.\d{6},-?\d+\.\d{6}$/);
      expect(a).toHaveAttribute("rel", "noopener noreferrer");
    }
    const noPlace = cards().find((c) => c.textContent?.includes("Místo zatím nepotvrzeno"))!;
    expect(noPlace).toBeTruthy();
    expect(within(noPlace).queryByRole("link", { name: "Navigovat na hřiště" })).toBeNull();
    expect(noPlace.textContent).toContain("není ověřená");
  });

  it("pin ↔ seznam: výběr se synchronizuje a stejné hřiště sdílí pin", async () => {
    setup(null);
    const pins = await screen.findAllByRole("button", { name: /^pin / });
    // Bez GPS / neověřené / zrušené / odložené zápasy pin nemají.
    expect(pins.some((p) => /Mez|Pole/.test(p.textContent ?? ""))).toBe(false);
    const shared = pins.find((p) => (p.textContent ?? "").includes(","))!;
    expect(shared).toBeTruthy();

    fireEvent.click(shared);
    const firstId = shared.textContent!.match(/\(([^,]+),/)![1];
    expect(document.querySelector(`[data-match-id="${firstId}"]`)).toHaveAttribute("aria-current", "true");

    // Klik na jiný zápas v seznamu zvýrazní jeho pin.
    const other = cards().find((c) => c.querySelector("a[href*='google']") && c.getAttribute("data-match-id") !== firstId)!;
    fireEvent.click(within(other).getAllByRole("button")[0]);
    expect(other).toHaveAttribute("aria-current", "true");
    const pressed = screen.getAllByRole("button", { name: /^pin / }).filter((p) => p.getAttribute("aria-pressed") === "true");
    expect(pressed).toHaveLength(1);
    expect(pressed[0].textContent).toContain(other.getAttribute("data-match-id")!);
  });

  it("výběr, který zmizí po změně filtru, se zruší", async () => {
    setup(null);
    const first = cards()[0];
    const id = first.getAttribute("data-match-id")!;
    fireEvent.click(within(first).getAllByRole("button")[0]);
    expect(first).toHaveAttribute("aria-current", "true");
    fireEvent.change(screen.getByPlaceholderText("Obec nebo hřiště v rozpisu"), { target: { value: "nic-takového" } });
    expect(screen.getByText(/žádný zápas nemáme/)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Obec nebo hřiště v rozpisu"), { target: { value: "" } });
    expect(document.querySelector(`[data-match-id="${id}"]`)).not.toHaveAttribute("aria-current");
  });

  it("bez polohy je filtr vzdálenosti vypnutý a nic neskrývá", () => {
    setup(null);
    expect(screen.getByLabelText("Vzdálenost")).toBeDisabled();
    expect(screen.queryByText(/km vzdušnou čarou/)).toBeNull();
  });

  it("zrušený zápas nemá navigaci, odložený neukazuje původní čas jako platný", () => {
    setup(null);
    fireEvent.click(screen.getByRole("button", { name: "Víkend" }));
    fireEvent.click(screen.getByRole("button", { name: "3 dny" }));
    const all = buildDemoMatches(new Date(NOW));
    const postponed = all.find((m) => m.status === "postponed")!;
    const card = document.querySelector(`[data-match-id="${postponed.id}"]`)!;
    expect(card.textContent).toContain("Odloženo");
    expect(card.querySelector("time")).toBeNull();
    expect(card.querySelector("a[href*='google']")).toBeNull();
  });
});
