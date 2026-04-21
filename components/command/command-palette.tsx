'use client'

import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Library, Heart, Folder, Upload, Hash } from 'lucide-react'
import type { Collection, Tag } from '@/types'

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  collections: Collection[]
  tags: Tag[]
}

export function CommandPalette({ open, onOpenChange, collections, tags }: CommandPaletteProps) {
  const router = useRouter()

  function navigate(href: string) {
    router.push(href)
    onOpenChange(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search icons, collections…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigate('/library')}>
            <Library className="h-4 w-4 mr-2" />
            All Icons
          </CommandItem>
          <CommandItem onSelect={() => navigate('/favorites')}>
            <Heart className="h-4 w-4 mr-2" />
            Favorites
          </CommandItem>
        </CommandGroup>

        {collections.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Collections">
              {collections.slice(0, 10).map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.name}
                  onSelect={() => navigate(`/library/${c.id}`)}
                >
                  <span className="mr-2 text-sm">{c.emoji ?? <Folder className="h-4 w-4" />}</span>
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {tags.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tags">
              {tags.slice(0, 8).map((tag) => (
                <CommandItem key={tag.id} value={tag.name}>
                  <Hash className="h-4 w-4 mr-2" style={{ color: tag.color }} />
                  {tag.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
