import { defineTranslations } from 'fumadocs-core/i18n';
import { uiTranslations } from 'fumadocs-ui/i18n';

/**
 * Fumadocs liefert kein deutsches Sprachpaket mit — die Schlüssel sind die
 * englischen Originalstrings. Was hier nicht übersetzt ist, bleibt englisch.
 */
export const translations = defineTranslations()
  .extend(uiTranslations())
  .add({
    displayName: 'Deutsch',

    // Suche
    'Search(search trigger)': 'Suchen',
    'Search(search dialog)': 'Suchen',
    'Open Search(search trigger)(aria-label)': 'Suche öffnen',
    'Close Search(search dialog)(aria-label)': 'Suche schließen',
    'No results found(search dialog)': 'Nichts gefunden',

    // Inhaltsverzeichnis
    'On this page(table of contents)': 'Auf dieser Seite',
    'No Headings(table of contents)': 'Keine Überschriften',
    'Table of Contents(inline table of contents)': 'Inhalt',

    // Seitenleiste
    'Hide Sidebar(sidebar)': 'Seitenleiste ausblenden',
    'Show Sidebar(sidebar)': 'Seitenleiste einblenden',
    'Open Sidebar(aria-label)': 'Seitenleiste öffnen',
    'Open Sidebar(sidebar)(aria-label)': 'Seitenleiste öffnen',
    'Close Sidebar(aria-label)': 'Seitenleiste schließen',
    'Close Sidebar(sidebar)(aria-label)': 'Seitenleiste schließen',
    'Collapse Sidebar(sidebar)(aria-label)': 'Seitenleiste einklappen',
    'Toggle Menu(home layout header)(aria-label)': 'Menü umschalten',

    // Erscheinungsbild
    'Toggle Theme(theme switcher)(aria-label)': 'Erscheinungsbild umschalten',
    'Light(theme switcher)(aria-label)': 'Hell',
    'Dark(theme switcher)(aria-label)': 'Dunkel',
    'System(theme switcher)(aria-label)': 'System',

    // Seitenaktionen
    'Copy Markdown(page actions)': 'Markdown kopieren',
    'View as Markdown(page actions)': 'Als Markdown ansehen',
    'Open(page actions)': 'Öffnen',
    'Open in GitHub(page actions)': 'In GitHub öffnen',
    'Open in Claude(page actions)': 'In Claude öffnen',
    'Open in ChatGPT(page actions)': 'In ChatGPT öffnen',
    'Open in Cursor(page actions)': 'In Cursor öffnen',
    'Open in Scira AI(page actions)': 'In Scira AI öffnen',
    'Read {url}, I want to ask questions about it.(page actions)':
      'Lies {url}, ich habe Fragen dazu.',
    'Edit on GitHub(edit page)': 'Auf GitHub bearbeiten',
    'Last updated on(page footer)': 'Zuletzt geändert am',

    // Code und Anker
    'Copy Text(code block)(aria-label)': 'Text kopieren',
    'Copied Text(code block)(aria-label)': 'Kopiert',
    'Copy Anchor Link(heading anchor)(aria-label)': 'Ankerlink kopieren',
    'Copy Link(accordion)(aria-label)': 'Link kopieren',

    // Blättern
    'Previous Page(pagination)': 'Zurück',
    'Next Page(pagination)': 'Weiter',

    // Typentabelle
    'Prop(type table)': 'Feld',
    'Type(type table)': 'Typ',
    'Default(type table)': 'Vorgabe',
    'Parameters(type table)': 'Parameter',
    'Returns(type table)': 'Rückgabe',

    // 404
    'Page Not Found(404 not found page)': 'Seite nicht gefunden',
    'Back to Home(404 not found page)': 'Zurück zum Anfang',
    'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.(404 not found page)':
      'Die Seite wurde vielleicht entfernt, umbenannt oder ist vorübergehend nicht erreichbar.',

    // Sonstiges
    'Ask AI(AI chat button)': 'KI fragen',
    'Close Banner(banner)(aria-label)': 'Hinweis schließen',
    'Choose a language(language switcher)': 'Sprache wählen',
    'Choose a language(language switcher)(aria-label)': 'Sprache wählen',
    'Layout Tab(layout tab trigger)': 'Bereich',
  });
