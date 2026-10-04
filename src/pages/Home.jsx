import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, ArrowLeft } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import Button from '../components/ui/Button'
import { toast } from '../components/ui/Toast'
import MemoryCalendar from '../components/home/MemoryCalendar'
import DayDetailPanel from '../components/home/DayDetailPanel'
import UpcomingList from '../components/home/UpcomingList'
import LastMetHero from '../components/home/LastMetHero'
import StoryStats from '../components/home/StoryStats'
import OnThisDay from '../components/home/OnThisDay'
import MilestoneCard from '../components/home/MilestoneCard'
import SurpriseMe from '../components/home/SurpriseMe'
import CreateMemoryWizard from '../components/memory/CreateMemoryWizard'
import EmptyState from '../components/ui/EmptyState'
import { useMemories } from '../hooks/useMemories'
import { useSpace } from '../hooks/useSpace'
import { useWishlist } from '../hooks/useWishlist'
import { useSpecialDates } from '../hooks/useSpecialDates'
import { getSpecialDays, expandYearlyDates } from '../lib/specialDays'
import { supabase } from '../lib/supabase'
import { getMilestoneDates, onThisDay, getTodayYMD, daysTogether, daysBetween, stats } from '../lib/milestones'

function timeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Home() {
  const { space, member, partner } = useSpace()
  const { memories, refresh: refreshMemories } = useMemories()
  const { items: wishlistItems, refresh: refreshWishlist, addItem: addWishlistItem, toggleDone: toggleWishlistDone, convertToMemory } = useWishlist()
  const { items: yearlyDates, addItem: addYearlyDate, deleteItem: deleteYearlyDate } = useSpecialDates()
  const todayStr = useMemo(() => getTodayYMD(), [])

  // Selected date on calendar (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  // Wishlist / Plans and Capsules state
  const [plans, setPlans] = useState([])
  const [capsules, setCapsules] = useState([])

  // Create Memory Wizard state
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardInitialDate, setWizardInitialDate] = useState(todayStr)

  // Track viewport size for mobile bottom sheet vs desktop column
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch Wishlist plans and Capsules for current space
  const fetchAuxiliaryData = useCallback(async () => {
    if (!space?.id) return

    // 1. Wishlist plans with target_date
    try {
      const { data: wishlistData } = await supabase
        .from('wishlist')
        .select('*')
        .eq('space_id', space.id)
        .not('target_date', 'is', null)
        .eq('is_done', false)
        .order('target_date', { ascending: true })

      if (wishlistData) setPlans(wishlistData)
    } catch (e) {
      console.error('Failed to load wishlist:', e)
    }

    // 2. Capsules opening dates
    try {
      const { data: capsuleData } = await supabase.rpc('list_capsules')
      if (capsuleData) setCapsules(capsuleData)
    } catch (e) {
      console.error('Failed to load capsules:', e)
    }
  }, [space?.id])

  useEffect(() => {
    fetchAuxiliaryData()
  }, [fetchAuxiliaryData])

  // Milestones calculation
  const milestones = useMemo(() => {
    if (!space?.start_date) return []
    return getMilestoneDates(space.start_date)
  }, [space?.start_date])

  // Next upcoming items
  const upcomingMilestone = useMemo(() => {
    return milestones.find((m) => m.date >= todayStr) || null
  }, [milestones, todayStr])

  const upcomingPlan = useMemo(() => {
    return plans.find((p) => p.target_date >= todayStr) || null
  }, [plans, todayStr])

  const upcomingCapsule = useMemo(() => {
    return (
      capsules.find((c) => {
        const d = c.opens_at?.split('T')[0]
        return d && d >= todayStr && !c.is_open
      }) || null
    )
  }, [capsules, todayStr])

  // Data for currently selected date
  const selectedDateMemories = useMemo(() => {
    if (!selectedDate) return []
    return memories.filter((m) => m.date?.split('T')[0] === selectedDate)
  }, [memories, selectedDate])

  const selectedDateMilestones = useMemo(() => {
    if (!selectedDate) return []
    return milestones.filter((m) => m.date === selectedDate)
  }, [milestones, selectedDate])

  const selectedDatePlans = useMemo(() => {
    if (!selectedDate) return []
    return plans.filter((p) => p.target_date?.split('T')[0] === selectedDate)
  }, [plans, selectedDate])

  const selectedDateCapsules = useMemo(() => {
    if (!selectedDate) return []
    return capsules.filter((c) => c.opens_at?.split('T')[0] === selectedDate)
  }, [capsules, selectedDate])

  const selectedDateOnThisDay = useMemo(() => {
    if (!selectedDate) return []
    return onThisDay(memories, selectedDate)
  }, [memories, selectedDate])

  const selectedDateWishlist = useMemo(() => {
    if (!selectedDate) return []
    return wishlistItems.filter((it) => it.target_date === selectedDate)
  }, [wishlistItems, selectedDate])

  // Built-in couple days + user-added yearly dates, resolved for a given year
  const specialDaysForYear = useCallback(
    (year) => [...getSpecialDays(year), ...expandYearlyDates(yearlyDates, year)],
    [yearlyDates]
  )

  const selectedDateSpecialDays = useMemo(() => {
    if (!selectedDate) return []
    const year = parseInt(selectedDate.slice(0, 4), 10)
    return specialDaysForYear(year).filter((d) => d.date === selectedDate)
  }, [specialDaysForYear, selectedDate])

  // Days together counter badge
  const totalDaysTogether = useMemo(() => {
    if (!space?.start_date) return null
    return daysTogether(space.start_date)
  }, [space?.start_date])

  // Most recent memory ("Last met") and story-so-far stats
  const latestMemory = useMemo(() => {
    if (!memories.length) return null
    return [...memories].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0]
  }, [memories])

  const daysSinceLastMemory = useMemo(() => {
    if (!latestMemory?.date) return null
    return daysBetween(latestMemory.date, todayStr)
  }, [latestMemory, todayStr])

  const storyStats = useMemo(() => stats(memories), [memories])

  // Actions
  const handleOpenAddMemory = (date = todayStr) => {
    setWizardInitialDate(date)
    setWizardOpen(true)
  }

  const handleOpenAddPlan = (date) => {
    toast(`Wishlist planning for ${date} coming soon ✨`)
  }

  const handleSelectDate = (dateStr) => {
    if (selectedDate === dateStr && !isMobile) {
      // Toggle off on desktop if re-clicking
      setSelectedDate(null)
    } else {
      setSelectedDate(dateStr)
    }
  }

  const partnerGreeting = useMemo(() => {
    if (member && partner) {
      return `${member.display_name} & ${partner.display_name}`
    }
    if (member) return member.display_name
    return 'you two'
  }, [member, partner])

  return (
    <AppShell>
      <div className="space-y-8">
        {/* ── Greeting Header ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Home
            </p>
            <h1
              className="text-3xl lg:text-4xl text-ink leading-tight font-display"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}
            >
              {timeGreeting()},<br />
              <span className="italic font-normal">{partnerGreeting}.</span>
            </h1>
            {totalDaysTogether !== null && (
              <p className="text-xs text-ink-muted font-medium pt-1">
                Day <span className="text-ink font-semibold">{totalDaysTogether}</span> of your story together
              </p>
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenAddMemory(todayStr)}
            className="self-start sm:self-end"
          >
            <Plus size={14} className="mr-1.5" />
            Add today's memory
          </Button>
        </div>

        {/* ── Last Met, On This Day, Story So Far, Milestones ──── */}
        {memories.length === 0 ? (
          <EmptyState
            message="Your next memory could start here."
            subtitle="The first page of your story is still blank."
            action={{ label: '+ Create a Memory', onClick: () => handleOpenAddMemory(todayStr) }}
          />
        ) : (
          <div className="space-y-8">
            <LastMetHero memory={latestMemory} daysSince={daysSinceLastMemory} />

            <OnThisDay memories={memories} todayStr={todayStr} onAddMemory={handleOpenAddMemory} />

            <StoryStats memories={storyStats.memories} photos={storyStats.photos} places={storyStats.places} />

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-stretch">
              <MilestoneCard startDate={space?.start_date} spaceId={space?.id} todayStr={todayStr} />
              <div className="flex items-center justify-center rounded-[var(--r-md)] border border-line bg-surface px-6 py-6 sm:px-8">
                <SurpriseMe memories={memories} />
              </div>
            </div>
          </div>
        )}

        {/* ── Main Layout: Desktop 2-column, Mobile stacked ──── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Calendar column */}
          <div className="lg:col-span-7 xl:col-span-8">
            <MemoryCalendar
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              memories={memories}
              milestones={milestones}
              plans={wishlistItems}
              capsules={capsules}
              specialDaysForYear={specialDaysForYear}
            />
          </div>

          {/* Desktop Right Column: Upcoming or Day Detail ────── */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-8 space-y-4">
            {selectedDate ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
                  >
                    <ArrowLeft size={13} />
                    <span>View upcoming</span>
                  </button>
                </div>
                <DayDetailPanel
                  date={selectedDate}
                  memories={selectedDateMemories}
                  milestones={selectedDateMilestones}
                  plans={selectedDatePlans}
                  capsules={selectedDateCapsules}
                  specialDays={selectedDateSpecialDays}
                  onAddYearlyDate={addYearlyDate}
                  onDeleteYearlyDate={deleteYearlyDate}
                  onThisDayMemories={selectedDateOnThisDay}
                  bucketItems={selectedDateWishlist}
                  onAddBucketItem={addWishlistItem}
                  onToggleBucketDone={toggleWishlistDone}
                  onConvertBucketItem={convertToMemory}
                  onMemoryCreated={() => {
                    refreshMemories()
                    fetchAuxiliaryData()
                  }}
                  onClose={() => setSelectedDate(null)}
                  onAddMemory={handleOpenAddMemory}
                  onAddPlan={handleOpenAddPlan}
                  isMobile={false}
                />
              </div>
            ) : (
              <UpcomingList
                upcomingMilestone={upcomingMilestone}
                upcomingPlan={upcomingPlan}
                upcomingCapsule={upcomingCapsule}
                onSelectDate={handleSelectDate}
                onAddMemory={() => handleOpenAddMemory(todayStr)}
                onAddPlan={handleOpenAddPlan}
              />
            )}
          </div>

          {/* Mobile Stacked: Upcoming always visible under calendar */}
          <div className="block lg:hidden">
            <UpcomingList
              upcomingMilestone={upcomingMilestone}
              upcomingPlan={upcomingPlan}
              upcomingCapsule={upcomingCapsule}
              onSelectDate={handleSelectDate}
              onAddMemory={() => handleOpenAddMemory(todayStr)}
              onAddPlan={handleOpenAddPlan}
            />
          </div>
        </div>

        {/* ── Mobile Day Detail Bottom Sheet ──────────────────── */}
        {isMobile && selectedDate && (
          <DayDetailPanel
            date={selectedDate}
            memories={selectedDateMemories}
            milestones={selectedDateMilestones}
            plans={selectedDatePlans}
            capsules={selectedDateCapsules}
            specialDays={selectedDateSpecialDays}
            onAddYearlyDate={addYearlyDate}
            onDeleteYearlyDate={deleteYearlyDate}
            onThisDayMemories={selectedDateOnThisDay}
            bucketItems={selectedDateWishlist}
            onAddBucketItem={addWishlistItem}
            onToggleBucketDone={toggleWishlistDone}
            onConvertBucketItem={convertToMemory}
            onMemoryCreated={() => {
              refreshMemories()
              fetchAuxiliaryData()
            }}
            onClose={() => setSelectedDate(null)}
            onAddMemory={handleOpenAddMemory}
            onAddPlan={handleOpenAddPlan}
            isMobile={true}
          />
        )}

        {/* ── Create Memory Wizard ───────────────────────────── */}
        <CreateMemoryWizard
          open={wizardOpen}
          initialDate={wizardInitialDate}
          onClose={() => setWizardOpen(false)}
          onSuccess={() => {
            refreshMemories()
            fetchAuxiliaryData()
          }}
        />
      </div>
    </AppShell>
  )
}
