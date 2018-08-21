const inquirer = require('inquirer')

module.exports = configManual
async function configManual(ctx, site, repo) {
  const key = await ctx.netlify.createDeployKey()
  ctx.log('\nGive this Netlify SSH public key access to your repository:\n')
  ctx.log(`\n${key.public_key}\n\n`)
  const { sshKeyAdded } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'sshKeyAdded',
      message: 'Continue?',
      default: true
    }
  ])
  if (!sshKeyAdded) ctx.exit()

  repo.provider = 'manual'
  repo.deploy_key_id = key.id

  // TODO: Look these up and default to the lookup order
  const { buildCmd, buildDir } = await inquirer.prompt([
    {
      type: 'input',
      name: 'buildCmd',
      message: 'Your build command (hugo build/yarn run build/etc):',
      filter: val => (val === '' ? undefined : val)
    },
    {
      type: 'input',
      name: 'buildDir',
      message: 'Directory to deploy (blank for current dir):',
      default: '.'
    }
  ])
  repo.dir = buildDir
  if (buildCmd) repo.cmd = buildCmd

  site = await ctx.netlify.updateSite({ siteId: site.id, body: { repo } })

  ctx.log('\nConfigure the following webhook for your repository:\n')
  ctx.log(`\n${site.deploy_hook}\n\n`)
  const { deployHookAdded } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'deployHookAdded',
      message: 'Continue?',
      default: true
    }
  ])
  if (!deployHookAdded) ctx.exit()
}
