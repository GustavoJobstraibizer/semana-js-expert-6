export default class Service {
    constructor({ url }) {
        this.url = url
    }

    async makeRequest(data) {
        const response = await fetch(this.url, {
            method: 'POST',
            body: JSON.stringify(data),
        })

        return response.json()
    }
}