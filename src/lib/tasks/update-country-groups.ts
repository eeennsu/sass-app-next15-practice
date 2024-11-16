import { db } from '@/drizzle/db'
import { CountryGroupTable, CountryTable } from '@/drizzle/schema'
import countriesByDiscount from '@/lib/data/countries-by-discount.json'
import { sql } from 'drizzle-orm'

const groupCount = await updateCountryGroups()
const countryCount = await updateCountries()

console.log(`Updated ${groupCount} country groups and ${countryCount} countries`)

async function updateCountryGroups() {
    const countryGroupInsertData = countriesByDiscount.map((discount) => ({
        name: discount.name,
        recommendedDiscountPercentage: discount.recommendedDiscountPercentage,
    }))

    const { rowCount } = await db
        .insert(CountryGroupTable)
        .values(countryGroupInsertData)
        .onConflictDoUpdate({
            target: CountryGroupTable.name,
            set: {
                recommendedDiscountPercentage: sql.raw(
                    `excluded.${CountryGroupTable.recommendedDiscountPercentage.name}`
                ),
            },
        })

    return rowCount
}

async function updateCountries() {
    const countryGroups = await db.query.CountryGroupTable.findMany({
        columns: {
            id: true,
            name: true,
        },
    })

    const countryInsertData = countriesByDiscount.flatMap(({ name, countries }) => {
        const countryGroup = countryGroups.find((group) => group?.name)

        if (!countryGroup) {
            throw new Error(`Country group not found for country ${name}`)
        }

        return countries.map((country) => ({
            countryGroupId: countryGroup.id,
            name: country.countryName,
            code: country.country,
        }))
    })

    const { rowCount } = await db
        .insert(CountryTable)
        .values(countryInsertData)
        .onConflictDoUpdate({
            target: CountryTable.code,
            set: {
                name: sql.raw(`excluded.${CountryTable.name.name}`),
                countryGroupId: sql.raw(`excluded.${CountryTable.countryGroupId.name}`),
            },
        })

    return rowCount
}
