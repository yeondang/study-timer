import { useEffect, useState } from 'react'

interface Props {
  url: string | null
  name: string
  size?: number
}

export default function Avatar({ url, name, size = 40 }: Props) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [url])

  const box = { width: size, height: size }

  if (url && !failed) {
    return (
      <img
        src={url}
        alt=""
        style={box}
        onError={() => setFailed(true)}
        className="shrink-0 rounded-full object-cover"
      />
    )
  }
  return (
    <div
      style={{ ...box, fontSize: size * 0.42 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700"
    >
      {name.trim().slice(0, 1).toUpperCase() || '?'}
    </div>
  )
}