const compactNumberFormatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
})

export const formatCompactNumber = (number: number) => {
    return compactNumberFormatter.format(number)
}

export const removeTrailingSlash = (path: string) => {
    return path.replace(/\/$/, '')
}
