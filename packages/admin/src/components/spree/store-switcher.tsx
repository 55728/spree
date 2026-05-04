import { ChevronsUpDownIcon, ExternalLinkIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useStore } from '@/providers/store-provider'

export function StoreSwitcher() {
  const { isMobile, state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const { store, isLoading } = useStore()

  if (isLoading) return <Skeleton className="h-header-height w-full rounded-xl" />

  const storeInitials = store?.name
    .split(' ')
    .map((name) => name[0])
    .join('')

  return (
    <SidebarMenu>
      <SidebarMenuItem className="h-header-height flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="flex w-full items-center">
            <button
              type="button"
              className="rounded-xl outline-hidden transition-colors duration-100 hover:bg-gray-200/50 data-[state=open]:bg-gray-200/50 gap-2 p-1.5"
            >
              <Avatar>
                {store?.logo_url && <AvatarImage src={store.logo_url} />}
                <AvatarFallback>{storeInitials}</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium text-zinc-950">{store?.name}</span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto size-4 text-gray-400" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-48"
            side={isMobile ? 'bottom' : 'right'}
            align="start"
            sideOffset={8}
          >
            <DropdownMenuItem>
              <ExternalLinkIcon className="size-4" />
              View Store
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
