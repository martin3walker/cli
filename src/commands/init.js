const { flags } = require('@oclif/command')
const gitRepoInfo = require('git-repo-info')
const parseGitRemote = require('parse-github-url')
const gitRemoteOriginUrl = require('git-remote-origin-url')

const Command = require('../base')
const createOrFindSite = require('../utils/init/create-or-find-site')
const configManual = require('../utils/init/config-manual')
const configGithub = require('../utils/init/config-github')
const renderShortDesc = require('../utils/renderShortDescription')

class InitCommand extends Command {
  async loadRepo() {
    const remoteUrl = await gitRemoteOriginUrl()
    if (!remoteUrl) this.error('CI requires a git remote.  No git remote found.')
    const parsedUrl = parseGitRemote(remoteUrl)
    const repoInfo = gitRepoInfo()

    const repo = {
      repo_path: parsedUrl.path,
      repo_branch: repoInfo.branch,
      allowed_branches: [repoInfo.branch]
    }

    switch (parsedUrl.host) {
      case 'github.com': {
        repo.provider = 'github'
        break
      }
      case 'gitlab.com': {
        repo.provider = 'gitlab'
        break
      }
    }

    return repo
  }

  async run() {
    const { flags } = this.parse(InitCommand)
    await this.authenticate()

    this.log('Configure continuous integration for a site')
    debugger
    const repo = await this.loadRepo()
    const site = await createOrFindSite(this, flags)

    if (flags.manual) {
      await configManual(this, site, repo)
    } else {
      switch (repo.provider) {
        case 'github': {
          await configGithub(this, site, repo)
          break
        }
        case 'gitlab':
        default: {
          this.error('No configurator found for the git hosting service')
        }
      }
    }
  }
}

InitCommand.description = `${renderShortDesc('Configure continuous deployment')}`

InitCommand.flags = {
  manual: flags.boolean(),
  force: flags.boolean()
}

module.exports = InitCommand
