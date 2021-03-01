/**
 * Example on how to use EJS and remotely stored templates to render content
 * @author skitsanos
 * @version 1.1.0
 */

const got = require('got');
const ejs = require('ejs');

export default async (req, res) => {
    try {
        const response = await got('https://template-ejs.skitsanos.repl.co');
        console.log(response.body);
        const html = ejs.render(response.body, {
            user: {
                name: 'Evgenios'
            }
        });

        res.send(html);
    } catch (error) {
        console.log(error.response.body);
        //=> 'Internal server error ...'
    }
}