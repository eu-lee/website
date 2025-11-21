import React, { useState, useRef, useEffect } from 'react'
import projects from '../data/projects.json'

const PROMPT = 'eugene@zsh ~ %'

function OutputLine({ prompt, children }) {
  return (
    <div className="flex gap-2 whitespace-pre-wrap">
      {prompt && <label className="text-green-400 text-sm font-normal whitespace-nowrap flex-shrink-0">{PROMPT}</label>}
      <div className="text-green-200 text-sm leading-[1.4] flex-1 break-words">{children ?? ''}</div>
    </div>
  )
}

export default function Terminal() {
  const [lines, setLines] = useState([])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [hIndex, setHIndex] = useState(null)
  const [projectsMode, setProjectsMode] = useState(false)
  const [selectedProject, setSelectedProject] = useState(0)
  const [sortBy, setSortBy] = useState('name') // 'name' or 'category'
  const [pageIndex, setPageIndex] = useState(0)
  const [projectsPerPage, setProjectsPerPage] = useState(4)

  const inputRef = useRef(null)
  const wrapperRef = useRef(null)

  // Calculate projects per page based on terminal height
  useEffect(() => {
    function calculateProjectsPerPage() {
      if (!wrapperRef.current) return
      const containerHeight = wrapperRef.current.clientHeight
      // Account for titlebar (~30px), header info (~20px), and input area (~20px)
      const availableHeight = containerHeight - 70
      // Each project takes ~60px (title + writeup + spacing)
      const perPage = Math.max(2, Math.floor(availableHeight / 60))
      setProjectsPerPage(perPage-1)
    }

    calculateProjectsPerPage()
    window.addEventListener('resize', calculateProjectsPerPage)
    return () => window.removeEventListener('resize', calculateProjectsPerPage)
  }, [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    wrapperRef.current?.scrollTo({ top: wrapperRef.current.scrollHeight })
  }, [lines, projectsMode])

  // keyboard handling for projects GUI
  useEffect(() => {
    if (!projectsMode) return
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedProject(i => {
          const next = Math.min(projects.length - 1, i + 1)
          setPageIndex(Math.floor(next / projectsPerPage))
          return next
        })
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedProject(i => {
          const next = Math.max(0, i - 1)
          setPageIndex(Math.floor(next / projectsPerPage))
          return next
        })
      } else if (e.key === 's' || e.key === 'S') {
        setSortBy(prev => prev === 'name' ? 'category' : 'name')
      } else if (e.key === 'Enter') {
        const p = projects[selectedProject]
        if (p && p.url) window.open(p.url, '_blank')
      } else if (e.key === 'Escape' || e.key === 'q') {
        setProjectsMode(false)
        pushLine({ type: 'output', content: 'Exited projects.' })
        setTimeout(() => inputRef.current?.focus(), 0)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [projectsMode, selectedProject])

  function pushLine(obj) {
    setLines(l => [...l, obj])
  }

  function clear() {
    setLines([])
  }

  function enterProjects() {
    clear()
    setProjectsMode(true)
    setSelectedProject(0)
  }

  function handleCommand(raw) {
    const cmd = raw.trim()
    pushLine({ type: 'input', content: cmd })
    if (!cmd) return
    setHistory(h => [...h, cmd])
    setHIndex(null)

    const parts = cmd.split(/\s+/)
    const base = parts[0]

    switch (base) {
      case 'help':
        pushLine({ type: 'output', content: `Commands: cat info.txt, whoami, clear, open projects, project <n>, help` })
        break
      case 'cat':
        if (parts[1] === 'info.txt') {
          pushLine({ type: 'output', content: `Name: Eugene Lee\nEmail: eugene@example.com\nWebsite: https://example.com\nTwitter: @eugene` })
        } else {
          pushLine({ type: 'output', content: `cat: ${parts.slice(1).join(' ')}: No such file` })
        }
        break
      case 'whoami':
        pushLine({ type: 'output', content: 'eugene' })
        break
      case 'clear':
        clear()
        break
      case 'projects':
      case 'open':
        // support `projects` or `cd projects`
        if (base === 'projects' || (parts[1] && parts[1] === 'projects')) {
          enterProjects()
        } else {
          pushLine({ type: 'output', content: `cd: ${parts.slice(1).join(' ')}: No such directory` })
        }
        break
      case 'project':
        if (!parts[1]) {
          pushLine({ type: 'output', content: 'project: missing index' })
          break
        }
        const idx = parseInt(parts[1], 10) - 1
        if (isNaN(idx) || idx < 0 || idx >= projects.length) {
          pushLine({ type: 'output', content: `project: invalid index ${parts[1]}` })
          break
        }
        const p = projects[idx]
        pushLine({ type: 'output', content: `${p.title}\n\n${p.writeup}` })
        pushLine({ type: 'thumbnail', content: p.thumbnail, link: p.url })
        break
      default:
        pushLine({ type: 'output', content: `${base}: command not found` })
    }
  }

  function onSubmit(e) {
    e.preventDefault()
    // if in projects mode, pressing Enter should open selected project instead of running command
    if (projectsMode) {
      const p = projects[selectedProject]
      if (p && p.url) window.open(p.url, '_blank')
      return
    }
    handleCommand(input)
    setInput('')
  }

  function onKeyDown(e) {
    if (projectsMode) return
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHIndex(i => {
        const next = i === null ? history.length - 1 : Math.max(0, i - 1)
        if (next >= 0) setInput(history[next])
        return next
      })
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHIndex(i => {
        if (i === null) return null
        const next = Math.min(history.length - 1, i + 1)
        setInput(history[next] ?? '')
        return next
      })
    }
  }

  return (
    <div className="w-screen h-screen bg-gradient-to-b from-slate-950 to-blue-950 flex items-center justify-center p-4">
      <div
        className="bg-slate-900 rounded-lg shadow-2xl w-1/2 h-1/2 overflow-auto p-4 flex flex-col"
        ref={wrapperRef}
        onClick={() => inputRef.current?.focus()}
      >
          {/* macOS titlebar */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex gap-2 items-center">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
              <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm" />
              <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
            </div>
            <div className="text-gray-500 text-xs">zsh — ~/</div>
            <div className="flex-1" />
          </div>

          {/* Terminal output lines */}
          {lines.map((l, idx) => {
            if (l.type === 'input') return <OutputLine key={idx} prompt>{l.content ?? ''}</OutputLine>
            if (l.type === 'thumbnail') {
              return (
                <div className="flex gap-2 whitespace-pre-wrap" key={idx}>
                  <label className="text-green-400 text-sm font-normal whitespace-nowrap flex-shrink-0"></label>
                  <div
                    className="text-sm leading-[1.4] flex-1 cursor-pointer break-words"
                    onClick={() => l.link && window.open(l.link, '_blank')}
                  >
                    <div dangerouslySetInnerHTML={{ __html: l.content ?? '' }} />
                  </div>
                </div>
              )
            }
            return (
              <OutputLine key={idx}>
                <pre className="text-gray-500 m-0 text-sm leading-[1.4]">{l.content ?? ''}</pre>
              </OutputLine>
            )
          })}

          {/* Projects GUI mode */}
          {projectsMode && (
            <div className="flex flex-col gap-0 py-1 overflow-auto flex-1">
              <div className="text-gray-500 text-xs mb-1">
                Press ↑↓ to navigate | s to sort | q/Esc to exit | Page {pageIndex + 1}/{Math.ceil(projects.length / projectsPerPage)} ({projects.length} total)
              </div>
              {projects
                .sort((a, b) => {
                  if (sortBy === 'name') return a.title.localeCompare(b.title)
                  return (a.category || '').localeCompare(b.category || '')
                })
                .slice(pageIndex * projectsPerPage, (pageIndex + 1) * projectsPerPage)
                .map((p, displayIdx) => {
                  const actualIdx = projects.findIndex(proj => proj.title === p.title)
                  return (
                    <div
                      key={displayIdx}
                      className={`flex gap-2 cursor-pointer transition-all py-0 ${
                        actualIdx === selectedProject ? 'font-bold' : ''
                      }`}
                      onClick={() => window.open(p.url, '_blank')}
                    >
                      <div className="flex-1 flex flex-col justify-start">
                        <div className={`text-green-200 text-sm leading-tight ${actualIdx === selectedProject ? 'font-bold' : 'font-normal'}`}>{p.title}</div>
                        <div className="text-gray-500 text-xs leading-tight">{p.writeup}</div>
                      </div>
                      <div className="flex-shrink-0 w-24 h-20">
                        <div className="project-thumb" dangerouslySetInnerHTML={{ __html: p.thumbnail }} />
                      </div>
                    </div>
                  )
                })}
              {(pageIndex + 1) * projectsPerPage < projects.length && (
                <div className="text-gray-500 text-xs mt-2 italic">↓ More projects below</div>
              )}
            </div>
          )}

          {/* Command input line - hidden when in projects mode */}
          {!projectsMode && (
            <form className="flex gap-2" onSubmit={onSubmit}>
              <label className="text-green-400 text-sm font-normal whitespace-nowrap flex-shrink-0">{PROMPT}</label>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                className="bg-transparent border-none outline-none text-green-200 font-inherit text-sm leading-[1.4] min-w-0 flex-1"
                autoComplete="off"
                spellCheck="false"
              />
            </form>
          )}
        </div>
    </div>
  )
}
