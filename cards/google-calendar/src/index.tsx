import { registerCard } from '../../../sdk/registry'
import GoogleCalendarCard from './GoogleCalendarCard'
import GoogleCalendarConfigUI from './GoogleCalendarConfigUI'
import cardCss from './GoogleCalendarCard.css?inline'

;(function injectStyles() {
  if (document.querySelector('style[data-card="google-calendar"]')) return
  const style = document.createElement('style')
  style.setAttribute('data-card', 'google-calendar')
  style.textContent = cardCss
  document.head.appendChild(style)
})()

registerCard({
  type: 'google-calendar',
  label: 'Google Calendar',
  icon: '📅',
  group: 'Productivity',
  defaultSize: [4, 3],
  minSize: [2, 2],
  needsEntity: false,
  component: GoogleCalendarCard,
  configUI: GoogleCalendarConfigUI,
})
