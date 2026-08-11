# Lakshan Primary Education Center — mobile design system

UI kit of the school-management **mobile app** (React + Tailwind CSS v4 + shadcn
"base-nova" on Base UI). Design **phone-first**: single-column layouts, cards as
tappable list rows, a sticky header and a fixed bottom tab bar.

## Setup

No provider or wrapper is required — components work standalone. Theme tokens are
plain CSS custom properties, already loaded via `styles.css`. Dark mode = a `dark`
class on any ancestor element. Base UI (not Radix) powers the primitives: pass a
component to a trigger with the `render` prop, **not** `asChild`:

```jsx
<SheetTrigger render={<Button variant="ghost" size="icon" />}>
  <MenuIcon />
</SheetTrigger>
```

Icons are lucide-react. Inside `Button`, mark leading/trailing icons with
`data-icon="inline-start"` / `data-icon="inline-end"` to get correct padding.

## Styling idiom

Style with Tailwind utilities on token colors — never hard-coded hex:

- Surfaces: `bg-background`, `bg-card`, `bg-muted`, `bg-popover`
- Text: `text-foreground`, `text-muted-foreground`, `text-card-foreground`
- Accents: `bg-primary text-primary-foreground`, `bg-secondary`, `bg-destructive/10 text-destructive`
- Borders/rings: `border-border`, `border-input`, `ring-ring`
- Radius scale: `rounded-md` / `rounded-lg` / `rounded-xl` / `rounded-2xl` (cards use `rounded-xl`)

The shipped stylesheet contains a curated utility set: layout (`flex`, `grid`,
`grid-cols-1..6`, `items-*`, `justify-*`), spacing (`p-*`/`m-*`/`gap-*` steps
0–12/16), sizing (`w-*`, `h-*`, `size-*`, `max-w-xs..3xl`, fractions), typography
(`text-xs..4xl`, `font-medium|semibold|bold`, `font-heading` for headings,
`truncate`, `line-clamp-1..3`), effects (`shadow-xs..xl`, `opacity-*`), and
position/z utilities. **Arbitrary values (`w-[13px]`) are not compiled — stay on
these families.** Safe-area padding for notched phones: `pt-safe`, `pb-safe`.

## Components

Avatar (AvatarFallback/Group/Badge), Badge, Button, Card (CardHeader/Title/
Description/Action/Content/Footer), Collapsible, Dialog, DropdownMenu (items must
sit inside `DropdownMenuGroup` when using `DropdownMenuLabel`), Input, Label,
Select (a styled **native** `<select>` — pass `<option>` children), Separator,
Sheet, Skeleton, Spinner, Switch (`checked`/`onCheckedChange`), Tooltip (wrap in
`TooltipProvider`), PageHeader (title/description/action props), StatCard
(title/value/icon/iconClassName/loading props).

Before styling anything custom, read `styles.css` (tokens live at the top) and the
component's `.d.ts` + `.prompt.md` under `components/general/<Name>/`.

## Idiomatic screen fragment

```jsx
<div className="space-y-4 p-4">
  <PageHeader
    title="Students"
    description="Register students and view QR ID cards."
    action={<Button><PlusIcon data-icon="inline-start" />Register</Button>}
  />
  <Card className="py-4">
    <CardContent className="flex items-center gap-3 px-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">Kavindi Silva</p>
        <p className="truncate text-xs text-muted-foreground">R. Silva · +94 77 123 4567</p>
        <div className="mt-1.5 flex gap-1.5">
          <Badge variant="secondary">Grade 4</Badge>
          <Badge variant="outline">Morning Batch</Badge>
        </div>
      </div>
      <Button variant="outline" size="icon" aria-label="Show QR ID"><QrCodeIcon /></Button>
    </CardContent>
  </Card>
</div>
```
